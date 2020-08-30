import React from "react";
import { useQuery } from "react-apollo";
import { ROOT_QUERY } from "./App";

const Photos = () => {
  const { loading, data } = useQuery(ROOT_QUERY);
  return loading ? (
    <p>loading...</p>
  ) : (
    data?.allPhotos?.map((photo) => (
      <img
        key={photo.id}
        src={`http://localhost:4000${photo.url}`}
        alt={photo.name}
        width={350}
      />
    ))
  );
};

export default Photos;
