import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, clearToken } from "../api";

function useCurrentUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/api/auth/me")
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
        }
      })
      .catch(() => {
        clearToken();
        navigate("/login", { replace: true });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return { user, setUser, isLoading };
}

export default useCurrentUser;
