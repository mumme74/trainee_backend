import { connect } from "react-redux";
import {FormSpy} from 'react-final-form';
import { updateFormState } from "../../actions/formAction";


const FormStateToRedux = ({ form, updateFormState }) => (
  <FormSpy onChange={(state) => updateFormState(form, state)} />
);

export default connect(null, { updateFormState })(FormStateToRedux);
