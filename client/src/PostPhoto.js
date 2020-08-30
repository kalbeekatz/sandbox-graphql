import React, { useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { gql } from "apollo-boost";
import { ROOT_QUERY } from "./App";
import { useMutation } from "react-apollo";

const POST_PHOTO_MUTATION = gql`
  mutation postPhoto($input: PostPhotoInput!) {
    postPhoto(input: $input) {
      id
      name
      url
    }
  }
`;

const PostPhoto = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PORTRAIT");
  const [file, setFile] = useState("");

  const history = useHistory();

  const postPhoto = useCallback(
    async (mutation) => {
      await mutation({
        variables: {
          input: {
            name,
            description,
            category,
            file,
          },
        },
      }).catch(console.error);
      history.replace("/");
    },
    [name, description, category, file, history]
  );

  const updatePhotos = (cache, { data: { postPhoto } }) => {
    var data = cache.readQuery({ query: ROOT_QUERY });
    cache.writeQuery({
      query: ROOT_QUERY,
      data: {
        ...data,
        allPhotos: [...data.allPhotos, postPhoto],
      },
    });
  };

  const [mutation] = useMutation(POST_PHOTO_MUTATION, { update: updatePhotos });

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <h1>Post a Photo</h1>
      <input
        type="text"
        style={{ margin: "10px" }}
        placeholder="photo name..."
        value={name}
        onChange={({ target }) => {
          setName(target.value);
        }}
      />
      <textarea
        type="text"
        style={{ margin: "10px" }}
        placeholder="photo description..."
        value={description}
        onChange={({ target }) => {
          setDescription(target.value);
        }}
      />
      <select
        value={category}
        style={{ margin: "10px" }}
        onChange={({ target }) => {
          setCategory(target.value);
        }}
      >
        <option value="PORTRAIT">PORTRAIT</option>
        <option value="LANDSCAPE">LANDSCAPE</option>
        <option value="ACTION">ACTION</option>
        <option value="GRAPHIC">GRAPHIC</option>
      </select>
      <input
        type="file"
        style={{ margin: "10px" }}
        accept="image/jpeg"
        onChange={({ target }) => {
          setFile(target.files && target.files.length ? target.files[0] : "");
        }}
      />
      <div style={{ margin: "10px" }}>
        <button onClick={() => postPhoto(mutation)}>Post Photo</button>
        <button onClick={() => history.goBack()}>Cancel</button>
      </div>
    </form>
  );
};

export default PostPhoto;
