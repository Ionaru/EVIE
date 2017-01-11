interface UserApiData {
  username: string;
  pid: string;
  email: string;
  characters: Array<CharacterApiData>;
}

interface LoginResponse {
  state: string;
  message: string;
  data: UserApiData;
}
