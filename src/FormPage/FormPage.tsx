import React from "react";
import Form from "react-jsonschema-form";
import Linkify from "react-linkify";
import FileWidget from "react-jsonschema-form/lib/components/widgets/FileWidget";
import { connect } from "react-redux";
import {
  setPage,
  setData,
  saveData,
  loadData,
  getUserProfile,
  submitForm,
  setFormName,
} from "../store/form/actions";

import { IFormPageProps } from "./types";
import { cloneDeep, get, set, pull } from "lodash";
import Loading from "../Loading/Loading";
import { push } from "connected-react-router";
import "./FormPage.scss";
import CustomDateWidget from "./CustomDateWidget";
import { TypeaheadField } from "react-jsonschema-form-extras/lib/TypeaheadField";

const SectionHeaderWidget = (props) => {
  const { schema } = props;
  return (
    <>
      <legend>{schema.title}</legend>
      {schema.custom_description && <p>{schema.custom_description}</p>}
    </>
  );
};

const FilePreviewWidget = (props) => {
  if (!props.value) {
    return <div>No file uploaded.</div>;
  }
  return (
    <div>
      <iframe
        src={props.value}
        style={Object.assign({ width: "100%", minHeight: 400 }, props.style)}
      ></iframe>
    </div>
  );
};

const FileInputAndPreviewWidget = (props) => {
  const output = [];

  if (props.value) {
    output.push(
      <FilePreviewWidget
        key="preview"
        {...props}
        style={{ marginBottom: 10 }}
      />
    );
  }

  output.push(
    <FileWidget
      key="file"
      {...props}
      value={undefined}
      onChange={(v) => {
        if (base64MimeType(v) !== "application/pdf") {
          window.alert("Uploaded file must be a PDF");
        } else {
          props.onChange(v);
        }
      }}
    />
  );

  return output;
};

const TextareaReadOnlyWidget = (props) => {
  return (
    <Linkify componentDecorator={LinkDecorator}>
      <div className="form-control">{props.value}</div>
    </Linkify>
  );
};

const LinkWidget = (props) => {
  return (
    <Linkify componentDecorator={LinkDecorator}>
      <div className="form-control">
        {(props.value || "").replace(",", " ")}
      </div>
    </Linkify>
  );
};

const LinkDecorator = (href, text, key) => {
  return (
    <a href={href} key={key} target="_blank">
      {text}
    </a>
  );
};

const TextareaWordCountingWidget = (props) => {
  const {
    id,
    options,
    placeholder,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    schema,
  } = props;

  const showWordCount = !!schema.word_count;
  const wordCount = value ? value.split(/[\s]+/).filter(el => el !== '').length : 0;

  const _onChange = ({ target: { value } }) => {
    return onChange(value === "" ? options.emptyValue : value);
  };

  const textarea = (
    <textarea
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={options.rows}
      onBlur={onBlur && ((event) => onBlur(id, event.target.value))}
      onFocus={onFocus && ((event) => onFocus(id, event.target.value))}
      onChange={_onChange}
    />
  );

  if (!showWordCount) {
    return textarea;
  }

  return (
    <div>
      {textarea}
      <div className="form-control-word-count">
        {wordCount} / {schema.word_count} words
      </div>
    </div>
  );
};

function base64MimeType(encoded) {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}
function validate(formData, errors, schema) {
  if (schema.properties.race && (!formData.race || !formData.race.length)) {
    errors.race.addError(
      'Please specify a race, or select "Prefer not to say"'
    );
  }

  // Word count limits
  Object.keys(schema.properties)
    .filter((key) => !!schema.properties[key].word_count)
    .forEach((key) => {
      const wordCount = schema.properties[key].word_count;
      if (formData[key] && formData[key].split(/[\s]+/).filter(el => el !== '').length > wordCount) {
        errors[key].addError(`Response cannot exceed ${wordCount} words`);
      }
    });

  if (schema.properties.university && !formData.university) {
    errors.university.addError("University is required");
  }

  /* if (schema.properties.top_track && !formData.top_track) {
    errors.top_track.addError("Please choose your top track");
  } */

  return errors;
}

export default (props: IFormPageProps) => {
  let widgets;
  if (props.submitted) {
    widgets = {
      sectionHeader: SectionHeaderWidget,
      customDate: CustomDateWidget,
      FileWidget: FilePreviewWidget,
      textarea: TextareaReadOnlyWidget,
      linkarea: LinkWidget,
    };
  } else {
    widgets = {
      sectionHeader: SectionHeaderWidget,
      customDate: CustomDateWidget,
      FileWidget: FileInputAndPreviewWidget,
      textarea: TextareaWordCountingWidget,
      linkarea: TextareaWordCountingWidget,
    };
  }
  let uiSchema = props.uiSchema;
  let schema = props.schema;
  if (props.shownFields) {
    // Hide other fields and make them not required.
    for (let field in schema.properties) {
      if (props.shownFields.indexOf(field) === -1) {
        set(uiSchema, `${field}.classNames`, "treehacks-hidden");
        if (schema.required) {
          pull(schema.required, field);
        }
      }
    }
  }

  return (
    <Form
      className={`treehacks-form ${
        props.submitted ? "treehacks-form-disabled" : ""
      }`}
      schema={schema}
      uiSchema={{
        ...uiSchema,
        "ui:readonly": props.submitted,
      }}
      formData={props.formData}
      //liveValidate={true}
      showErrorList={true}
      validate={(a, b) => validate(a, b, schema)}
      fields={{ typeahead: TypeaheadField }}
      widgets={widgets}
      onChange={(e) => props.onChange(e)}
      onError={(e) => props.onError(e)}
      onSubmit={(e) => props.onSubmit(e)}
    >
      {!props.submitted ? (
        props.children || (
          <div className="btn-container">
            <div>
              <input
                className="btn btn-custom inverted"
                type="submit"
                value="Save for later"
                onClick={(e) => {
                  e.preventDefault();
                  props.onSubmit(false);
                }}
              />
              <input
                className="btn btn-custom"
                type="submit"
                value="Submit"
                //onClick={e => this.onSubmit(true)}
              />
            </div>
          </div>
        )
      ) : (
        <div></div>
      )}
    </Form>
  );
};