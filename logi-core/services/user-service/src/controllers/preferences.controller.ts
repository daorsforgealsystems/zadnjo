import { Controller, Get, Put, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { PreferencesService } from '../services/preferences.service';
import { 
  LayoutPreferences, 
  NavigationPreferences, 
  LayoutTemplate,
  UserRole 
} from '../interfaces/preferences.interface';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  // Layout Preferences
  @Get('layout/:userId')
  async getLayoutPreferences(@Param('userId') userId: string): Promise<LayoutPreferences> {
    return this.preferencesService.getLayoutPreferences(userId);
  }

  @Put('layout/:userId')
  async updateLayoutPreferences(
    @Param('userId') userId: string,
    @Body() preferences: Partial<LayoutPreferences>
  ): Promise<LayoutPreferences> {
    return this.preferencesService.updateLayoutPreferences(userId, preferences);
  }

  // Navigation Preferences
  @Get('navigation/:userId')
  async getNavigationPreferences(@Param('userId') userId: string): Promise<NavigationPreferences> {
    return this.preferencesService.getNavigationPreferences(userId);
  }

  @Put('navigation/:userId')
  async updateNavigationPreferences(
    @Param('userId') userId: string,
    @Body() preferences: Partial<NavigationPreferences>
  ): Promise<NavigationPreferences> {
    return this.preferencesService.updateNavigationPreferences(userId, preferences);
  }

  // Layout Templates
  @Get('templates')
  async getLayoutTemplates(@Query('role') role?: UserRole): Promise<LayoutTemplate[]> {
    return this.preferencesService.getLayoutTemplates(role);
  }

  @Post('templates')
  async createLayoutTemplate(@Body() template: Omit<LayoutTemplate, 'id'>): Promise<LayoutTemplate> {
    return this.preferencesService.createLayoutTemplate(template);
  }

  @Put('templates/:templateId')
  async updateLayoutTemplate(
    @Param('templateId') templateId: string,
    @Body() template: Partial<LayoutTemplate>
  ): Promise<LayoutTemplate> {
    return this.preferencesService.updateLayoutTemplate(templateId, template);
  }

  @Delete('templates/:templateId')
  async deleteLayoutTemplate(@Param('templateId') templateId: string): Promise<void> {
    return this.preferencesService.deleteLayoutTemplate(templateId);
  }

  @Post('templates/:templateId/apply/:userId')
  async applyLayoutTemplate(
    @Param('templateId') templateId: string,
    @Param('userId') userId: string
  ): Promise<LayoutPreferences> {
    return this.preferencesService.applyLayoutTemplate(templateId, userId);
  }

  // User Layout Customization
  @Post('layout/:userId/save-custom')
  async saveCustomLayout(
    @Param('userId') userId: string,
    @Body() layoutData: {
      name: string;
      description?: string;
      components: any[];
      gridConfig: any;
    }
  ): Promise<LayoutTemplate> {
    return this.preferencesService.saveUserCustomLayout(userId, layoutData);
  }

  // Dashboard Component Preferences
  @Get('components/:userId')
  async getDashboardComponents(@Param('userId') userId: string) {
    return this.preferencesService.getDashboardComponents(userId);
  }

  @Put('components/:userId')
  async updateDashboardComponents(
    @Param('userId') userId: string,
    @Body() components: any[]
  ) {
    return this.preferencesService.updateDashboardComponents(userId, components);
  }

  // Reset to defaults
  @Post('reset/:userId')
  async resetPreferences(
    @Param('userId') userId: string,
    @Query('type') type?: 'layout' | 'navigation' | 'all'
  ): Promise<void> {
    return this.preferencesService.resetUserPreferences(userId, type);
  }

  // Export/Import preferences
  @Get('export/:userId')
  async exportPreferences(@Param('userId') userId: string) {
    return this.preferencesService.exportUserPreferences(userId);
  }

  @Post('import/:userId')
  async importPreferences(
    @Param('userId') userId: string,
    @Body() preferencesData: any
  ) {
    return this.preferencesService.importUserPreferences(userId, preferencesData);
  }
}