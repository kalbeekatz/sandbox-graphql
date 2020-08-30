import React, { useState, useEffect } from "react";
import { useHistory, NavLink } from "react-router-dom";
import { useApolloClient, useQuery, useMutation } from "react-apollo";
import { gql } from "apollo-boost";
import { ROOT_QUERY } from "./App";

const GITHUB_AUTH_MUTATION = gql`
  mutation githubAuth($code: String!) {
    githubAuth(code: $code) {
      token
    }
  }
`;

const AuthorizedUser = () => {
  const [signingIn, setSigningIn] = useState(false);
  const history = useHistory();

  const authorizationComplete = (cache, { data }) => {
    localStorage.setItem("token", data.githubAuth.token);
    history.replace("/");
    setSigningIn(false);
  };

  const [mutation] = useMutation(GITHUB_AUTH_MUTATION, {
    update: authorizationComplete,
    refetchQueries: [{ query: ROOT_QUERY }],
  });

  useEffect(() => {
    if (window.location.search.match(/code=/)) {
      setSigningIn(true);
      const code = window.location.search.replace("?code=", "");
      mutation({ variables: { code } });
    }
  }, [mutation]);

  const requestCode = () => {
    var clientID = process.env.REACT_APP_CLIENT_ID;
    window.location = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=user`;
  };

  const client = useApolloClient();

  return (
    <Me
      signingIn={signingIn}
      requestCode={requestCode}
      logout={() => {
        localStorage.removeItem("token");
        const data = client.readQuery({ query: ROOT_QUERY });
        client.writeQuery({
          query: ROOT_QUERY,
          data: {
            ...data,
            me: null,
          },
        });
      }}
    />
  );
};

const Me = ({ logout, requestCode, signingIn }) => {
  const { loading, data } = useQuery(ROOT_QUERY, {
    fetchPolicy: "cache-only",
  });

  return data?.me?.avatar ? (
    <CurrentUser {...data.me} logout={logout} />
  ) : loading ? (
    <p>loading... </p>
  ) : (
    <button onClick={requestCode} disabled={signingIn}>
      Sign In with GitHub
    </button>
  );
};

const CurrentUser = ({ name, avatar, logout }) => (
  <div>
    <img src={avatar} width={48} height={48} alt="" />
    <h1>{name}</h1>
    <button onClick={logout}>logout</button>
    <NavLink to="/newPhoto">Post Photo</NavLink>
  </div>
);

export default AuthorizedUser;
