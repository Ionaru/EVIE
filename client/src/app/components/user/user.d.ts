interface UserApiData {
  username: string;
  pid: string;
  email: string;
  characters: Array<ApiCharacterData>;
}

interface LoginResponse {
  state: string;
  message: string;
  data: UserApiData;
}
