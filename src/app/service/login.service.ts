import { Injectable } from '@angular/core';
import { getAuth, Auth, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
import { Plugins } from '@capacitor/core';
const { CapacitorHttp } = Plugins;


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  /**
   * Generates a custom token for a given user ID.
   *
   * @param {string} uid - The user ID for which to generate the custom token.
   * @return {Promise<string>} A promise that resolves to the generated custom token.
   */
  public async generateCustomToken(uid: string): Promise<string> {
    // Send a GET request to the backend API to generate a custom token for the given user ID.
    // The request includes the user ID as a query parameter.
    // The response from the API contains the generated custom token.
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "generate-custom-token",
      params: { uid: uid }
    });
    
    // Return the custom token from the response.
    return response.data;
  }

  /**
   * Verifies a custom token.
   * 
   * @param {string} token - The custom token to verify.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
   * whether the token is valid or not.
   */
  public async verifyCustomToken(token: string): Promise<boolean> {
    // Pass the custom token in the Authorization header of the request.
    // The token must be prefixed with the string "Bearer ".

    // Set the headers for the request.
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token // Prefix the token with "Bearer ".
    };

    // Send a GET request to the backend API to verify the token.
    const response = await CapacitorHttp['get']({
      url: environment.BACKEND_API + "verify-custom-token", // The backend API endpoint.
      headers: headers // The headers containing the token.
    });

    // Return the data from the response, indicating whether the token is valid or not.
    return response.data;
  }

  /**
   * Logs in a user with the given email and password.
   * 
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @return {Promise<string | null>} A promise that resolves to the custom token of the user, or null if the login fails.
   */
  public async login(email: string, password: string): Promise<string | null> {
    const auth: Auth = getAuth(); // Get the Firebase Auth instance.
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Try to sign in with the provided email and password.
      
      // Login successful, return the custom token.
      const user = userCredential.user;
      console.log("uid: ", user.uid); // Log the user's UID.
      const customToken = await this.generateCustomToken(user.uid); // Generate a custom token for the user.
      console.log("customToken: ", customToken); // Log the custom token.

      return customToken; // Return the custom token.
    } catch (error) {
      console.error('Errore durante il login:', error); // Log the error if the login fails.
      throw error; // Rethrow the error to be handled by the calling function.
    }
  }

  /**
   * Saves the authentication token to the device's local storage.
   *
   * @param {string} token - The token to save.
   * @return {Promise<void>} - A promise that resolves when the token is saved, or rejects with an error.
   */
  public async saveToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'authToken',
        value: token
      });
    } catch (error) {
      console.error('Errore durante il salvataggio del token:', error);
    }
  }


  /**
   * Retrieves the authentication token from the device's local storage.
   *
   * @return {Promise<string>} A promise that resolves to the token, or an empty string if it is not found.
   */
  public async getToken(): Promise<string> {
    try {
      // Try to get the token from the local storage.
      const result = await Preferences.get({ key: 'authToken' });
      
      // Return the token if it is present, otherwise an empty string.
      return result.value || ''; 
    } catch (error) {
      // Log the error if retrieving the token fails.
      console.error('Errore durante il recupero del token:', error);
      
      // Return an empty string if retrieving the token fails.
      return '';
    }
  }

  /**
   * Saves the bus code to the device's local storage.
   *
   * @param {string} busCode - The bus code to save.
   * @return {Promise<void>} - A promise that resolves when the bus code is saved, or rejects with an error.
   */
  public async saveBusCode(busCode: string): Promise<void> {
    try {
      // Save the bus code to the local storage.
      await Preferences.set({
        key: 'busCode', // The key to store the bus code under.
        value: busCode // The bus code to save.
      });
    } catch (error) {
      // Log the error if saving the bus code fails.
      console.error('Errore durante il salvataggio del codice del pullman:', error);
    }
  }

  /**
   * Retrieves the bus code from the device's local storage.
   *
   * @return {Promise<string>} A promise that resolves to the bus code, or an empty string if it is not found.
   */
  public async getBusCode(): Promise<string> {
    try {
      // Try to get the bus code from the local storage.
      const result = await Preferences.get({ key: 'busCode' });

      // Return the bus code if it is present, otherwise an empty string.
      return result.value || ''; 
    } catch (error) {
      // Log the error if retrieving the bus code fails.
      console.error('Errore durante il recupero del codice del pullman:', error);

      // Return an empty string if retrieving the bus code fails.
      return '';
    }
  }

  /**
   * Checks if the user is logged in by verifying the custom token.
   *
   * @return {Promise<boolean>} A promise that resolves to true if the user is logged in, false otherwise.
   */
  public async isLoggedIn(): Promise<boolean> {
    try {
      // Retrieve the authentication token from the local storage.
      const token = await this.getToken();

      // Verify the custom token to check if the user is logged in.
      const isTokenValid = await this.verifyCustomToken(token);

      // Return the result of the verification.
      return isTokenValid;
    } catch (error) {
      // Log the error and return false if the verification fails.
      console.error('Errore durante il controllo dello stato di accesso:', error);
      return false;
    }
  }

  /**
   * Logs out the user by removing the authentication token from the local storage.
   *
   * @return {Promise<void>} A promise that resolves when the logout is complete, or rejects with an error.
   */
  public async logout(): Promise<void> {
    try {
      // Remove the authentication token from the local storage.
      await Preferences.remove({ key: 'authToken' });
    } catch (error) {
      // Log the error if the logout fails.
      console.error('Errore durante il logout:', error);
    }
  }
}
