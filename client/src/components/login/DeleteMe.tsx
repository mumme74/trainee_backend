import React, { useState } from "react";
import { RouteComponentProps } from "react-router";
import { Form, Field } from "react-final-form";
import { useHistory } from "react-router-dom";
import axios from "axios";

import FormRow from "../form/FormRow";
import { SERVERURL } from "../../config/config";
import { store, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/actions/auth";

type DeleteForm = {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type StatePropsT = {};

type JsxPropsT = {};

const DeleteMe: React.FC<StatePropsT & JsxPropsT & RouteComponentProps> = (
  props
) => {
  const Stages = ["Initial", "Confirm", "Are your sure?", "Do it!"];
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  const history = useHistory();

  function cancelHandler() {
    history.push("/student/profile");
  }

  function okHandler() {
    setStage(stage + 1);
  }

  async function onSubmit(values: DeleteForm) {
    console.log("onSubmit");
    try {
      const res = await axios.post(`${SERVERURL}/users/deletemyself`, values);
      if (!res || !res.data) {
        setError("Something went wrong in transport to server");
      }

      if (!res.data.success) {
        setError(res.data.error);
      }

      // it went through, fire a logout dispath in a couple of seconds
      setTimeout(() => {
        logout()(store.dispatch);
      }, 5000);

      // got to last view
      setStage(3);
    } catch (err) {
      setError(err.message);
    }
  }

  const buttonRow = (
    <div className="row-sm-2">
      <button className="btn btn-primary mx-2" onClick={cancelHandler}>
        No
      </button>
      <button className="btn btn-secondary mx-2" onClick={okHandler}>
        Yes
      </button>
    </div>
  );

  const nav = Stages.map((pos) => {
    const idx = Stages.indexOf(pos);
    const btnCss = "btn btn-link nav-item";
    if (idx <= stage) {
      return (
        <span className="col-sm">
          {idx > 0 && "/"}
          <button
            className={btnCss + (idx === stage ? " bold" : "")}
            onClick={() => {
              setStage(idx);
            }}
            disabled={stage === 3}
          >
            {pos}
          </button>
        </span>
      );
    }
    return (
      <span className="col-sm">
        /
        <button className={btnCss} disabled={true}>
          {pos}
        </button>
      </span>
    );
  });

  if (stage === 0) {
    return (
      <div className="container">
        <h2>Do you want to Delete yourself from this system?</h2>
        <p>
          This can <b>not</b> be undone!
        </p>
        <div className="row-sm-4">{nav}</div>
        <div className="row">{buttonRow}</div>
      </div>
    );
  } else if (stage === 1) {
    return (
      <div className="container">
        <h2>Do you want to Delete yourself from this system?</h2>
        <p>All your work will be deleted!</p>
        <div className="row-sm-4">{nav}</div>
        <div className="row">{buttonRow}</div>
      </div>
    );
  } else if (stage === 2) {
    return (
      <div className="container">
        <h2>Do you want to Delete yourself from this system?</h2>
        <p>
          Is this <b>Really</b> what you want?
        </p>
        <div className="row-sm-4">{nav}</div>
        <Form
          onSubmit={onSubmit}
          render={({ handleSubmit, pristine, form, submitting }) => (
            <form onSubmit={handleSubmit} className="container p-2">
              <div className="row">
                <div className="col-sm-2"></div>
                <h3 className="col-sm">
                  Enter your details to ensure you are you.
                </h3>
              </div>
              <Field
                name="userName"
                type="text"
                caption="Username"
                component={FormRow}
              />
              <Field
                name="firstName"
                type="text"
                caption="First name"
                component={FormRow}
              />
              <Field
                name="lastName"
                type="text"
                caption="Last name"
                component={FormRow}
              />
              <Field
                name="email"
                type="email"
                caption="Email"
                component={FormRow}
              />
              <Field
                name="password"
                type="password"
                caption="Password"
                component={FormRow}
              />
              <div className="row-sm-2">
                <button
                  className="btn btn-secondary mx-2"
                  onClick={cancelHandler}
                >
                  No
                </button>
                <button className="btn btn-primary mx-2">Yes</button>
                <span className="badge bg-danger">{error}</span>
              </div>
            </form>
          )}
        ></Form>
      </div>
    );
  } else {
    return (
      <div className="container">
        <h2>A Request to delete you have been sent to the server!</h2>
        <p>You can't undo it now...</p>
        <p>You can't say I didn't warn you.</p>
        <div className="row-sm-4 bg-warning">{nav}</div>
        <button
          onClick={() => {
            props.history.push("/");
          }}
          className="btn btn-link"
        >
          To startpage
        </button>
      </div>
    );
  }
};

export default DeleteMe;
