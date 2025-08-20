import { useContext } from 'react';
import AuthContext from './authCore';

export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
