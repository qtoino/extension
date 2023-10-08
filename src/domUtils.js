

function extractFormFields() {
    const fields = [];

    // Get all input fields
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
        fields.push({
            type: 'input',
            name: input.name,
            value: input.value,
            placeholder: input.placeholder,
            typeAttribute: input.type // This will get the type attribute, like 'text', 'password', 'radio', etc.
        });
    }

    // Get all textarea fields
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
        fields.push({
            type: 'textarea',
            name: textarea.name,
            value: textarea.value,
            placeholder: textarea.placeholder,
        });
    }

    // Get all select fields (dropdowns)
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
        const options = Array.from(select.options).map(option => ({
            value: option.value,
            text: option.text,
            selected: option.selected
        }));

        fields.push({
            type: 'select',
            name: select.name,
            options: options
        });
    }

    return fields;
}