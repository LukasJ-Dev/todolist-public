import { GlobalSettingsModel } from '../../models/globalSettingsModel';

export interface GlobalRestrictions {
  aiDisabled?: boolean;
  createTodolistsDisabled?: boolean;
  createTasksDisabled?: boolean;
  loginDisabled?: boolean;
  registerDisabled?: boolean;
}

export interface GlobalLimits {
  maxTodolists?: number;
  maxTasks?: number;
  maxAIMessages?: number;
}

export interface GlobalSettings {
  restrictions: GlobalRestrictions;
  limits: GlobalLimits;
}

/**
 * Service for managing global settings (restrictions and limits)
 */
export class GlobalSettingsService {
  /**
   * Get current global settings
   */
  async getGlobalSettings(): Promise<GlobalSettings> {
    const settings = await GlobalSettingsModel.findOne();
    if (!settings) {
      // Create default settings if none exist
      const newSettings = await GlobalSettingsModel.create({
        restrictions: {},
        limits: {},
      });
      return {
        restrictions: newSettings.restrictions || {},
        limits: newSettings.limits || {},
      };
    }
    return {
      restrictions: settings.restrictions || {},
      limits: settings.limits || {},
    };
  }

  /**
   * Update global restrictions
   */
  async updateGlobalRestrictions(
    restrictions: GlobalRestrictions
  ): Promise<GlobalSettings> {
    const settings = await GlobalSettingsModel.findOne();
    if (!settings) {
      const newSettings = await GlobalSettingsModel.create({
        restrictions,
        limits: {},
      });
      return {
        restrictions: newSettings.restrictions || {},
        limits: newSettings.limits || {},
      };
    }
    settings.restrictions = { ...settings.restrictions, ...restrictions };
    await settings.save();
    return {
      restrictions: settings.restrictions || {},
      limits: settings.limits || {},
    };
  }

  /**
   * Update global limits
   */
  async updateGlobalLimits(limits: GlobalLimits): Promise<GlobalSettings> {
    const settings = await GlobalSettingsModel.findOne();
    if (!settings) {
      const newSettings = await GlobalSettingsModel.create({
        restrictions: {},
        limits,
      });
      return {
        restrictions: newSettings.restrictions || {},
        limits: newSettings.limits || {},
      };
    }
    settings.limits = { ...settings.limits, ...limits };
    await settings.save();
    return {
      restrictions: settings.restrictions || {},
      limits: settings.limits || {},
    };
  }
}

// Export singleton instance
export const globalSettingsService = new GlobalSettingsService();

