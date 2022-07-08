import { dexieDb, SettingsModel } from '../dexie'

export class Settings {
  urlOperation: string
  urlResolve: string
  needChallenge: boolean

  constructor() {
    // デフォルト値
    this.urlOperation = 'https://beta.ion.msidentity.com/api/v1.0/'
    this.urlResolve = 'https://beta.discover.did.microsoft.com/1.0/'
    this.needChallenge = true
  }

  async load() {
    // indexedDBからLoad
    const dbUrlOperation = await dexieDb.settings.get(
      SettingsModel.KEYS.URL_OPERATION
    )
    if (dbUrlOperation) {
      this.urlOperation = dbUrlOperation.value as string
    }
    const dbUrlResolve = await dexieDb.settings.get(
      SettingsModel.KEYS.URL_RESOLVE
    )
    if (dbUrlResolve) {
      this.urlResolve = dbUrlResolve.value as string
    }
    const dbNeedChallenge = await dexieDb.settings.get(
      SettingsModel.KEYS.NEED_CHALLENGE
    )
    if (dbNeedChallenge) {
      this.needChallenge = dbNeedChallenge.value as boolean
    }
  }

  async save() {
    // indexedDBにSave
    await dexieDb.settings.put(
      new SettingsModel(SettingsModel.KEYS.URL_OPERATION, this.urlOperation)
    )
    await dexieDb.settings.put(
      new SettingsModel(SettingsModel.KEYS.URL_RESOLVE, this.urlResolve)
    )
    await dexieDb.settings.put(
      new SettingsModel(SettingsModel.KEYS.NEED_CHALLENGE, this.needChallenge)
    )
  }

  static async load() {
    const settings = new Settings()
    await settings.load()
    return settings
  }

  static async clear() {
    await dexieDb.settings.clear()
  }
}
