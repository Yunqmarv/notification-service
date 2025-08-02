const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        required: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isEditable: {
        type: Boolean,
        default: true
    },
    validation: {
        required: {
            type: Boolean,
            default: false
        },
        min: Number,
        max: Number,
        pattern: String,
        enum: [String]
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance
settingsSchema.index({ category: 1, key: 1 });
settingsSchema.index({ isPublic: 1 });
settingsSchema.index({ isEditable: 1 });

// Methods
settingsSchema.methods.toJSON = function() {
    const settings = this.toObject();
    return {
        key: settings.key,
        value: settings.value,
        type: settings.type,
        category: settings.category,
        description: settings.description,
        isPublic: settings.isPublic,
        isEditable: settings.isEditable,
        validation: settings.validation,
        metadata: settings.metadata,
        updatedAt: settings.updatedAt
    };
};

// Statics
settingsSchema.statics.getByCategory = function(category) {
    return this.find({ category }).sort({ key: 1 });
};

settingsSchema.statics.getPublicSettings = function() {
    return this.find({ isPublic: true }).sort({ category: 1, key: 1 });
};

settingsSchema.statics.updateSetting = async function(key, value, userId = null) {
    const setting = await this.findOne({ key });
    if (!setting) {
        throw new Error(`Setting '${key}' not found`);
    }
    
    if (!setting.isEditable) {
        throw new Error(`Setting '${key}' is not editable`);
    }
    
    // Validate the value
    if (setting.validation.required && (value === null || value === undefined)) {
        throw new Error(`Setting '${key}' is required`);
    }
    
    if (setting.validation.min !== undefined && value < setting.validation.min) {
        throw new Error(`Setting '${key}' must be at least ${setting.validation.min}`);
    }
    
    if (setting.validation.max !== undefined && value > setting.validation.max) {
        throw new Error(`Setting '${key}' must be at most ${setting.validation.max}`);
    }
    
    if (setting.validation.enum && setting.validation.enum.length > 0 && !setting.validation.enum.includes(value)) {
        throw new Error(`Setting '${key}' must be one of: ${setting.validation.enum.join(', ')}`);
    }
    
    if (setting.validation.pattern) {
        const regex = new RegExp(setting.validation.pattern);
        if (!regex.test(value)) {
            throw new Error(`Setting '${key}' does not match required pattern`);
        }
    }
    
    setting.value = value;
    setting.metadata.lastModifiedBy = userId;
    setting.metadata.lastModifiedAt = new Date();
    
    return await setting.save();
};

module.exports = mongoose.model('Setting', settingsSchema);
