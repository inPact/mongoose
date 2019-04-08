module.exports = function plugin(schema) {
    schema.add({ hidden: { type: Boolean, default: false } });
    schema.index({ hidden: -1 }, { sparse: true });
};
