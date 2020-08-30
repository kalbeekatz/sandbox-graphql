import React, { useEffect } from "react";
import { gql } from "apollo-boost";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Users from "./Users";
import AuthorizedUser from "./AuthorizedUser";
import { useApolloClient } from "react-apollo";
import Photos from "./Photos";
import PostPhoto from "./PostPhoto";

export const ROOT_QUERY = gql`
  query allUsers {
    totalUsers
    totalPhotos
    allUsers {
      ...userInfo
    }
    me {
      ...userInfo
    }
    allPhotos {
      id
      name
      url
    }
  }

  fragment userInfo on User {
    githubLogin
    name
    avatar
  }
`;

const LISTEN_FOR_USERS = gql`
  subscription {
    newUser {
      githubLogin
      name
      avatar
    }
  }
`;

const App = () => {
  const client = useApolloClient();
  useEffect(() => {
    const listenForUsers = client
      .subscribe({ query: LISTEN_FOR_USERS })
      .subscribe(({ data: { newUser } }) => {
        const data = client.readQuery({ query: ROOT_QUERY });
        client.writeQuery({
          query: ROOT_QUERY,
          data: {
            ...data,
            totalUsers: data.totalUsers + 1,
            allUsers: [...data.allUsers, newUser],
          },
        });
      });

    return listenForUsers.unsubscribe;
  }, []);
  return (
    <BrowserRouter>
      <Switch>
        <Route
          exact
          path="/"
          component={() => (
            <>
              <AuthorizedUser />
              <Users />
              <Photos />
            </>
          )}
        />
        <Route path="/newPhoto" component={PostPhoto} />
        <Route
          component={({ location }) => <h1>"{location.pathname}" not found</h1>}
        />
      </Switch>
    </BrowserRouter>
  );
};

export default App;
