const validators = {
  emailValidator: (value: string) => {
    return /.+@.+\..+/.test(value) ? "" : "Invalid";
  },

  passwordValidator: (value: string) => {
    return /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/gm.test(
      value,
    )
      ? ""
      : "10 chars, atleast: 1 UPPER, 1 lower, 1 special and 1 number";
  },

  required: (value: string) => {
    return value?.length > 0 ? "" : "Required";
  },
  userName: (value: string) => {
    return value?.length > 2 && value.indexOf("@") < 0
      ? ""
      : "Username must be at least 3chars and not contain '@'";
  },
};

export default validators;
