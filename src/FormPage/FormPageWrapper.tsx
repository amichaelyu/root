import React from "react";
import Form from "react-jsonschema-form";
import { connect } from 'react-redux';
import { setPage, setData, saveData, loadData, getUserProfile, submitForm, setFormName } from "../store/form/actions";

import { IFormPageWrapperProps } from "./types";
import { cloneDeep, get, set, pull } from "lodash-es";
import Loading from "../Loading/Loading";
import { push } from 'connected-react-router';
import CustomDateWidget from './CustomDateWidget';
import { TypeaheadField } from "react-jsonschema-form-extras/lib/TypeaheadField";
import FormPage from "./FormPage";

const mapStateToProps = state => ({
    ...state.form
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    setPage: (e) => dispatch(setPage(e)),
    setData: (e) => dispatch(setData(e)),
    saveData: () => dispatch(saveData()),
    submitForm: () => dispatch(submitForm()),
    loadData: () => { dispatch(loadData()) },
    goHome: () => { dispatch(push("/")) },
    getUserProfile: () => dispatch(getUserProfile()),
    setFormName: (e: string) => dispatch(setFormName(e))
});

class FormPageWrapper extends React.Component<IFormPageWrapperProps, { showSavedAlert: boolean }> {
    constructor(props) {
        super(props);
        this.state = { showSavedAlert: false };
    }
    componentDidMount() {
        this.props.setFormName(this.props.incomingFormName);
        this.props.loadData();
        // this.props.setData({"first_name":"sad","last_name":"dsf","phone":"123123123","dob":"1901-01-02","gender":"F","race":["American Indian / Alaska Native"],"university":"2nd Military Medical University","graduation_year":"2018","level_of_study":"Graduate","major":"sa","accept_terms":true,"accept_share":true});
        this.props.getUserProfile();
    }
    onSubmit(submit) {
        const props = this.props;
        (get(props, "profile.status") === "submitted" ? () => Promise.resolve(null) : props.saveData)().then(() => {
            if (submit) {
                return props.submitForm().then(() => props.goHome());
            } else {
                this.setState({ showSavedAlert: true });
                window.scrollTo(0, 0);
            }
        });
    }
    render() {
        if (!this.props.formData) {
            return <Loading />;
        }
        const props = this.props;
        const schema = props.schemas[props.formName].schema;
        const uiSchema = props.schemas[props.formName].uiSchema;

        const submitted = get(props, "profile.status") === "submitted";

        const alertMessage = submitted ? `Thanks for applying! Check your dashboard for updates on your application, and email us if any of the information submitted changes.` :
            this.state.showSavedAlert ? `Your application progress has been saved. Make sure you finalize and submit before the deadline.` : null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {alertMessage && <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '550px', marginTop: '60px', marginBottom: '-40px', padding: '20px', color: 'white', textAlign: 'center' }}>
                    {alertMessage}
                </div>}
                <FormPage
                    submitted={submitted}
                    onChange={e => { props.setData(e.formData) }}
                    onError={() => window.scrollTo(0, 0)}
                    onSubmit={(e) => this.onSubmit(e)}
                    schema={schema}
                    uiSchema={uiSchema}
                    formData={props.formData} />
            </div>);
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(FormPageWrapper);