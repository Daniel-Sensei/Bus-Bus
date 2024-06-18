import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  constructor() { }

  // keys: 'favouriteRoutes', 'favouriteStops', 'recentSearches'

  private async updatePreferences(key: string, value: string[]): Promise<void> {
    try {
      if (key=="recentSearches" && value.length > 5) {
        value.pop(); // Rimuove ultimo elemento se la lunghezza supera 5
      }
      await Preferences.set({
        key: key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error(`Errore durante l'aggiornamento delle preferenze per ${key}:`, error);
    }
  }

  public async addToFavorites(key: string, item: string): Promise<void> {
    try {
      const existingItems = await this.getPreferences(key);
      const updatedItems = [item, ...existingItems.filter(i => i !== item)]; // Rimuove l'elemento se esiste già
      await this.updatePreferences(key, updatedItems);
    } catch (error) {
      console.error(`Errore durante l'aggiunta di ${item} ai preferiti per ${key}:`, error);
    }
  }

  public async removeFromFavorites(key: string, item: string): Promise<void> {
    try {
      const existingItems = await this.getPreferences(key);
      const updatedItems = existingItems.filter(i => i !== item);
      await this.updatePreferences(key, updatedItems);
    } catch (error) {
      console.error(`Errore durante la rimozione di ${item} dai preferiti per ${key}:`, error);
    }
  }

  public async getFavorites(key: string): Promise<string[]> {
    try {
      return await this.getPreferences(key);
    } catch (error) {
      console.error(`Errore durante il recupero dei preferiti per ${key}:`, error);
      return [];
    }
  }

  private async getPreferences(key: string): Promise<string[]> {
    try {
      const result = await Preferences.get({ key: key });
      return result.value ? JSON.parse(result.value) : [];
    } catch (error) {
      console.error(`Errore durante il recupero delle preferenze per ${key}:`, error);
      return [];
    }
  }
}
