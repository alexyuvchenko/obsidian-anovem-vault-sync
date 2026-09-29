import { Notice, PluginSettingTab, Setting, type App } from "obsidian";
import { errorMessage } from "./errors";
import type VaultSyncPlugin from "./main";

export class VaultSyncSettingTab extends PluginSettingTab {
  private authUrl = "";
  private authCode = "";

  constructor(app: App, private readonly plugin: VaultSyncPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", {
      text: "Syncs Markdown notes and one attachments folder through Dropbox. Install this plugin in the vault on the Mac and on the iPhone. Both devices use the same Dropbox folder and the same attachments path.",
    });
    containerEl.createEl("p", {
      text: "The Mac vault can stay on Google Drive. The iPhone vault can stay on iCloud. This plugin reads the open vault and copies those files through Dropbox.",
    });
    containerEl.createEl("p", {
      text: "While Obsidian is open, the vault syncs in the background. One run uploads changes from this device and downloads changes from Dropbox. It also syncs when you return to the app. If a file changed on both devices, or it was removed on only one device, it is left in place. Resolve it in the vault, then sync again.",
    });

    new Setting(containerEl)
      .setName("Dropbox app key")
      .setDesc("Create a Scoped access app in the Dropbox App Console. On Permissions, enable files.metadata.read, files.content.read, files.content.write, and account_info.read, then click Submit. Paste only the App key. It is 15 characters. Do not paste the App secret. Full Dropbox access uses the folder below. App folder access keeps files inside that app; set the folder to / to use the root of the app folder.")
      .addText((text) => {
        text.setPlaceholder("App key").setValue(this.plugin.settings.appKey);
        text.onChange(async (value) => {
          this.plugin.settings.appKey = value.trim();
          await this.plugin.persist();
        });
      });

    new Setting(containerEl)
      .setName("Dropbox folder")
      .setDesc("Folder for every synced vault. Each vault is stored in a subfolder with the vault's name, so the Mac and the iPhone need the same vault name.")
      .addText((text) => {
        text.setPlaceholder("/ObsidianAnovem").setValue(this.plugin.settings.dropboxFolder);
        text.onChange(async (value) => {
          this.plugin.settings.dropboxFolder = value.trim();
          await this.plugin.persist();
        });
      });

    new Setting(containerEl)
      .setName("Attachments folder")
      .setDesc("Folder inside the vault. Markdown notes anywhere in the vault are included. Other files are included only from this folder. Use the same path, including capital letters, on every device.")
      .addText((text) => {
        text.setPlaceholder("attachments").setValue(this.plugin.settings.attachmentsFolder);
        text.onChange(async (value) => {
          this.plugin.settings.attachmentsFolder = value.trim();
          await this.plugin.persist();
        });
      });

    if (this.plugin.settings.refreshToken) {
      new Setting(containerEl)
        .setName("Dropbox account")
        .setDesc(this.plugin.settings.accountEmail || "Connected")
        .addButton((button) => {
          button.setButtonText("Disconnect").setWarning();
          button.onClick(async () => {
            await this.plugin.client.disconnect();
            this.authUrl = "";
            this.authCode = "";
            this.display();
          });
        });
    } else {
      new Setting(containerEl)
        .setName("Connect Dropbox")
        .setDesc("Opens Dropbox so you can copy an authorization code. Paste that code below.")
        .addButton((button) => {
          button.setButtonText("Open Dropbox").setCta();
          button.onClick(async () => {
            try {
              this.authUrl = await this.plugin.client.authorizationUrl();
              window.open(this.authUrl, "_blank");
              this.display();
            } catch (error) {
              new Notice(errorMessage(error));
            }
          });
        });

      if (this.authUrl || this.plugin.settings.codeVerifier) {
        new Setting(containerEl)
          .setName("Authorization address")
          .setDesc("If the browser did not open, copy this address and open it.")
          .addTextArea((text) => {
            text.setValue(this.authUrl);
            text.inputEl.rows = 3;
            text.inputEl.readOnly = true;
          });
        new Setting(containerEl)
          .setName("Authorization code")
          .addText((text) => {
            text.setPlaceholder("Paste the code").setValue(this.authCode);
            text.onChange((value) => {
              this.authCode = value.trim();
            });
          })
          .addButton((button) => {
            button.setButtonText("Connect").setCta();
            button.onClick(async () => {
              try {
                await this.plugin.client.exchangeCode(this.authCode);
                this.authUrl = "";
                this.authCode = "";
                this.display();
                const email = this.plugin.settings.accountEmail;
                new Notice(email ? `Connected as ${email}` : "Connected to Dropbox.");
              } catch (error) {
                new Notice(errorMessage(error));
              }
            });
          });
      }
    }

    new Setting(containerEl)
      .setName("Background sync")
      .setDesc("Runs while Obsidian is open, including while you edit. It also runs when you come back to the app. It stops when Obsidian is closed.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.backgroundSync);
        toggle.onChange(async (value) => {
          this.plugin.settings.backgroundSync = value;
          await this.plugin.persist();
          this.plugin.scheduleBackgroundSync();
        });
      });

    new Setting(containerEl)
      .setName("Sync every")
      .setDesc("Minutes between background syncs. From 1 to 240.")
      .addText((text) => {
        text.setPlaceholder("5").setValue(String(this.plugin.settings.syncIntervalMinutes));
        text.onChange(async (value) => {
          const minutes = Number(value);
          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) return;
          this.plugin.settings.syncIntervalMinutes = minutes;
          await this.plugin.persist();
          this.plugin.scheduleBackgroundSync();
        });
      });

    new Setting(containerEl)
      .setName("Sync")
      .setDesc(this.plugin.settings.lastSyncSummary || "Not synced yet.")
      .addButton((button) => {
        button.setButtonText("Show conflicts");
        button.onClick(() => this.plugin.showConflicts());
      })
      .addButton((button) => {
        button.setButtonText("Sync both ways").setCta();
        button.onClick(() => {
          void this.plugin.syncNow();
        });
      });

    new Setting(containerEl)
      .setName("Backup format")
      .setDesc("The file is named {timestamp}_{vault name}.zip or {timestamp}_{vault name}.gzip. gzip is a gzip-compressed tar of the vault. The backup folder itself is left out of the archive.")
      .addDropdown((dropdown) => {
        dropdown.addOption("zip", "zip");
        dropdown.addOption("gzip", "gzip");
        dropdown.setValue(this.plugin.settings.backupFormat === "gzip" ? "gzip" : "zip");
        dropdown.onChange(async (value) => {
          this.plugin.settings.backupFormat = value === "gzip" ? "gzip" : "zip";
          await this.plugin.persist();
        });
      });

    new Setting(containerEl)
      .setName("Backup folder")
      .setDesc("Folder inside the vault. On the Mac the file stays with the Google Drive vault. On the iPhone it stays with the iCloud vault.")
      .addText((text) => {
        text.setPlaceholder("backups").setValue(this.plugin.settings.backupFolder);
        text.onChange(async (value) => {
          this.plugin.settings.backupFolder = value.trim();
          await this.plugin.persist();
        });
      });

    new Setting(containerEl)
      .setName("Backup")
      .addButton((button) => {
        button.setButtonText("Backup vault").setCta();
        button.onClick(() => {
          void this.plugin.backupNow();
        });
      });
  }
}
