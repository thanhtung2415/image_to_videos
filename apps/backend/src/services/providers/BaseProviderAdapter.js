export class BaseProviderAdapter {
  constructor({ name, enabled, models }) {
    this.name = name;
    this.enabled = enabled;
    this.models = models;
  }

  getSupportedModels() {
    return this.models;
  }

  getModelCapabilities(modelId) {
    return this.models.find((model) => model.id === modelId) || null;
  }

  estimateCost(modelId, options = {}) {
    const model = this.getModelCapabilities(modelId);

    if (!model) {
      return null;
    }

    const duration = Number(options.duration || model.defaultDuration || 5);
    return model.baseCredits + Math.max(0, duration - model.defaultDuration) * model.extraSecondCredits;
  }

  async createGeneration() {
    throw new Error(`${this.name} provider is not implemented yet`);
  }

  async getGenerationStatus() {
    throw new Error(`${this.name} provider is not implemented yet`);
  }

  async cancelGeneration() {
    throw new Error(`${this.name} provider is not implemented yet`);
  }

  async getGenerationResult() {
    throw new Error(`${this.name} provider is not implemented yet`);
  }
}

