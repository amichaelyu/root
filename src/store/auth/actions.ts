import { IUserAttributes } from "./types.d";
import { API, Auth } from "aws-amplify";
import { Cache } from 'aws-amplify';
import { loadingStart, loadingEnd } from "../base/actions";

export const loggedIn = (userId, attributes) => ({
  type: 'LOGIN_SUCCESS',
  userId,
  attributes
});

export const loggedOut = () => ({
  type: 'LOGOUT_SUCCESS'
});
export const renderProfile = (profileData) => ({
  type: 'RENDER_PROFILE',
  profileData
});

export function logout() {
  return dispatch => {
    loadingStart();
    console.log("signing out");
    Cache.removeItem("federatedInfo");
    localStorage.clear();
    console.log(Cache.getAllKeys());
    Auth.signOut().then(e => {
      loadingEnd();
      dispatch(loggedOut());
    })
  }
}

function getCurrentUser() {
  return Auth.currentAuthenticatedUser();
}

export function checkLoginStatus() {
  return (dispatch, getState) => {
    dispatch(loadingStart());
    getCurrentUser()
      .then((user: { username: string, attributes: IUserAttributes }) => {
        if (!user) throw "No credentials";
        dispatch(loggedIn(user.username, user.attributes));
      }).catch(e => {
        console.error(e);
      }).then(() => dispatch(loadingEnd()));
  }
}

export const setAuthPage = (authPage, message = "", error = "") => ({
  type: 'SET_AUTH_PAGE',
  authPage: authPage,
  message: message,
  error: error
})

export const setMessage = (message) => ({
  type: 'SET_MESSAGE',
  message: message
})

export const onAuthError = (error) => ({
  type: 'SET_ERROR',
  error: error
})

export function signIn(data) {
  return dispatch => {
    dispatch(loadingStart());
    Auth.signIn(data.email, data.password)
      .then(() => dispatch(checkLoginStatus()))
      .catch(e => dispatch(onAuthError(e.message)))
      .then(() => dispatch(loadingEnd()))
  }
}

export function signUp(data) {
  return dispatch => {
    if (data.password != data.password2) {
      dispatch(onAuthError("Passwords do not match."));
      return;
    }
    dispatch(loadingStart());
    Auth.signUp({
      username: data.email,
      password: data.password,
      attributes: {
        email: data.email,
        name: "User",
        website: (window.location != window.parent.location) ? document.referrer : window.location.href // Link for confirmation email
      }
    })
      .then(() => dispatch(setAuthPage("signIn", "Account creation complete. Please check your email for a confirmation link to confirm your email address, then sign in below. If you don't see the email, please check your spam folder.")))
      .catch(e => dispatch(onAuthError(e.message)))
      .then(() => dispatch(loadingEnd()))
  }
}

export function forgotPassword(data) {
  return dispatch => {
    dispatch(loadingStart());
    Auth.forgotPassword(data.email)
      .then(() => dispatch(setAuthPage("forgotPasswordSubmit", "Verification email sent. Please check your email for a code and enter the code below to change your password. If you don't see the email, please check your spam folder.")))
      .catch(e => dispatch(onAuthError(e.message)))
      .then(() => dispatch(loadingEnd()))
  }
}

export function forgotPasswordSubmit(data) {
  return dispatch => {
    if (data.password != data.password2) {
      dispatch(onAuthError("Passwords do not match."));
      return;
    }
    dispatch(loadingStart());
    Auth.forgotPasswordSubmit(data.email, data.code, data.password)
      .then(() => dispatch(setAuthPage("signIn", "Password changed successfully! Please log in with your new password:")))
      .catch(e => dispatch(onAuthError(e.message)))
      .then(() => dispatch(loadingEnd()))
  }
}