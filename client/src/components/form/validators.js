const validators = {
  emailValidator: (value) => {
    return /.+@.+\..+/.test(value) ? "" : "Invalid";
  },

  passwordValidator: (value, meta) => {
    return /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/gm.test(
      value
    )
      ? ""
      : "10 chars, atleast: 1 UPPER, 1 lower, 1 special and 1 number";
  },

  required: (value) => {
    return value && value.length > 0 ? "" : "Required";
  },
  userName: (value) => {
    return value?.length > 2 && value.indexOf("@") < 0
      ? ""
      : "Username must be at least 3chars and not contain '@'";
  },
};

export default validators;
