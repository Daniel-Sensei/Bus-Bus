import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  constructor() { }

  // KEYS: 'favouriteRoutes', 'favouriteStops', 'recentSearches'

  /**
   * Update the preferences with the given key and value.
   * If the key is 'recentSearches' and the length of the value is greater than 5,
   * remove the last element of the value array.
   * @param key The key of the preference to update.
   * @param value The new value to set for the preference.
   */
  private async updatePreferences(key: string, value: string[]): Promise<void> {
    try {
      // If the key is 'recentSearches' and the length of the value is greater than 5,
      // remove the last element of the value array.
      if (key=="recentSearches" && value.length > 5) {
        value.pop(); // Remove the last element if the length exceeds 5
      }
      
      // Set the preference with the given key and value.
      await Preferences.set({
        key: key, // The key of the preference to update
        value: JSON.stringify(value) // The new value to set for the preference
      });
    } catch (error) {
      // Log an error message if an error occurs during the update
      console.error(`Error during the update of preferences for ${key}:`, error);
    }
  }

  /**
   * Adds the given item to the favorites list for the specified key.
   * If the item already exists in the list, it will not be added again.
   * @param key The key of the favorites list to update.
   * @param item The item to add to the favorites list.
   */
  public async addToFavorites(key: string, item: string): Promise<void> {
    try {
      // Get the existing items in the favorites list for the specified key.
      const existingItems = await this.getPreferences(key);

      // Add the new item to the list of existing items,
      // but only if it does not already exist in the list.
      const updatedItems = [
        item,
        ...existingItems.filter(i => i !== item)
      ];

      // Update the preferences with the new list of items.
      await this.updatePreferences(key, updatedItems);
    } catch (error) {
      // Log an error message if an error occurs during the addition.
      console.error(`Errore durante l'aggiunta di ${item} ai preferiti per ${key}:`, error);
    }
  }

  /**
   * Removes the given item from the favorites list for the specified key.
   * If the item does not exist in the list, nothing happens.
   * @param key The key of the favorites list to update.
   * @param item The item to remove from the favorites list.
   */
  public async removeFromFavorites(key: string, item: string): Promise<void> {
    try {
      // Get the existing items in the favorites list for the specified key.
      const existingItems = await this.getPreferences(key);

      // Create a new list of items by filtering out the specified item.
      const updatedItems = existingItems.filter(i => i !== item);

      // Update the preferences with the new list of items.
      await this.updatePreferences(key, updatedItems);
    } catch (error) {
      // Log an error message if an error occurs during the removal.
      console.error(`Errore durante la rimozione di ${item} dai preferiti per ${key}:`, error);
    }
  }

  /**
   * Retrieves the list of favorite items for the specified key.
   * @param key The key of the favorites list to retrieve.
   * @returns A Promise that resolves to the list of favorite items.
   */
  public async getFavorites(key: string): Promise<string[]> {
    try {
      // Retrieve the list of favorite items for the specified key.
      return await this.getPreferences(key);
    } catch (error) {
      // Log an error message if an error occurs during the retrieval.
      console.error(`Errore durante il recupero dei preferiti per ${key}:`, error);
      return [];
    }
  }


  /**
   * Retrieves the preferences for the specified key.
   * @param key The key of the preferences to retrieve.
   * @returns A Promise that resolves to the preferences as an array of strings.
   * If the preferences do not exist, an empty array is returned.
   */
  private async getPreferences(key: string): Promise<string[]> {
    try {
      // Retrieve the preferences for the specified key.
      const result = await Preferences.get({ key: key });
      
      // Parse the value of the preferences as an array of strings and return it.
      return result.value ? JSON.parse(result.value) : [];
    } catch (error) {
      // Log an error message if an error occurs during the retrieval.
      console.error(`Errore durante il recupero delle preferenze per ${key}:`, error);
      return [];
    }
  }
}
