/**
 * js/config-utils.js
 * Utilitaires de mapping pour convertir les codes JSON en labels lisibles.
 */

const getFullDept = (code) => {
    if (typeof CONFIG_DEPTS !== 'undefined' && Array.isArray(CONFIG_DEPTS)) {
        const dept = CONFIG_DEPTS.find(d => d.code.toUpperCase() === code.toUpperCase());
        return dept ? dept.label : code.toUpperCase();
    }
    return code.toUpperCase();
};

const getFullStatus = (codeOrLabel) => {
    if (typeof CONFIG_STATUS !== 'undefined' && Array.isArray(CONFIG_STATUS)) {
        const status = CONFIG_STATUS.find(s => 
            s.code.toUpperCase() === codeOrLabel.toUpperCase() || 
            s.label.toUpperCase() === codeOrLabel.toUpperCase()
        );
        return status ? status.label : codeOrLabel;
    }
    return codeOrLabel;
};