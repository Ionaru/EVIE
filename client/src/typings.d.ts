// Typings reference file, you can add your own global typings here
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

/// <reference path="app/components/character/character.d.ts" />
/// <reference path="app/components/character/character.service.d.ts" />
/// <reference path="app/components/user/user.d.ts" />
/// <reference path="app/pages/dashboard/location.service.d.ts" />
/// <reference path="app/pages/dashboard/ship.service.d.ts" />

interface SSOSocketResponse {
  state: string;
  message: string;
  data: ApiCharacterData | undefined;
}
