import 'react-native-gesture-handler/jestSetup';
import { Crypto } from '@peculiar/webcrypto';
import { jest } from '@jest/globals';

// Mock crypto for UUID generation
declare global {
  var crypto: Crypto;
}
global.crypto = new Crypto();

// Type-safe mocks
jest.mock('expo-file-system', () => ({}));

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn().mockImplementation(() => ({
    transaction: jest.fn(),
    exec: jest.fn(),
  })),
}));
