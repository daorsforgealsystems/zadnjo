import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NavigationService } from '../services/navigation.service';
import { UserRole } from '../interfaces/preferences.interface';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  // Get navigation menu for user role
  @Get('menu/:role')
  async getNavigationMenu(@Param('role') role: UserRole) {
    return this.navigationService.getNavigationForRole(role);
  }

  // Check route access permission
  @Get('access-check')
  async checkRouteAccess(
    @Query('userId') userId: string,
    @Query('route') route: string,
    @Query('role') role: UserRole
  ) {
    const hasAccess = await this.navigationService.canAccessRoute(userId, route, role);
    return { hasAccess, route, userId, role };
  }

  // Get available actions for role
  @Get('actions/:role')
  async getAvailableActions(@Param('role') role: UserRole) {
    const actions = await this.navigationService.getAvailableActions(role);
    return { role, actions };
  }

  // Get restricted components for role
  @Get('restricted-components/:role')
  async getRestrictedComponents(@Param('role') role: UserRole) {
    const components = await this.navigationService.getRestrictedComponents(role);
    return { role, restrictedComponents: components };
  }

  // Get default landing page for role
  @Get('landing-page/:role')
  async getDefaultLandingPage(@Param('role') role: UserRole) {
    const landingPage = await this.navigationService.getDefaultLandingPage(role);
    return { role, landingPage };
  }

  // Log user activity
  @Post('activity/:userId')
  async logActivity(
    @Param('userId') userId: string,
    @Body() activityData: {
      action: string;
      target: string;
      metadata?: any;
    }
  ) {
    await this.navigationService.logUserActivity(
      userId,
      activityData.action,
      activityData.target,
      activityData.metadata
    );
    return { success: true };
  }

  // Get navigation analytics
  @Get('analytics/:userId')
  async getNavigationAnalytics(@Param('userId') userId: string) {
    return this.navigationService.generateNavigationAnalytics(userId);
  }

  // Generate breadcrumbs
  @Get('breadcrumbs')
  async getBreadcrumbs(
    @Query('route') route: string,
    @Query('role') role: UserRole
  ) {
    const breadcrumbs = await this.navigationService.generateBreadcrumbs(route, role);
    return { route, breadcrumbs };
  }

  // Update navigation badge
  @Post('badge/:itemId')
  async updateNavigationBadge(
    @Param('itemId') itemId: string,
    @Body() { count }: { count: number }
  ) {
    await this.navigationService.updateNavigationBadge(itemId, count);
    return { itemId, count, updated: true };
  }

  // Get user navigation customization
  @Get('customization/:userId')
  async getUserNavigationCustomization(@Param('userId') userId: string) {
    return this.navigationService.getUserNavigationCustomization(userId);
  }

  // Bulk route access check
  @Post('bulk-access-check')
  async bulkRouteAccessCheck(
    @Body() checkData: {
      userId: string;
      role: UserRole;
      routes: string[];
    }
  ) {
    const results = await Promise.all(
      checkData.routes.map(async (route) => ({
        route,
        hasAccess: await this.navigationService.canAccessRoute(
          checkData.userId,
          route,
          checkData.role
        )
      }))
    );

    return {
      userId: checkData.userId,
      role: checkData.role,
      results
    };
  }

  // Get navigation permissions summary
  @Get('permissions/:role')
  async getNavigationPermissions(@Param('role') role: UserRole) {
    const [actions, restrictedComponents, landingPage, menuStructure] = await Promise.all([
      this.navigationService.getAvailableActions(role),
      this.navigationService.getRestrictedComponents(role),
      this.navigationService.getDefaultLandingPage(role),
      this.navigationService.getNavigationForRole(role)
    ]);

    return {
      role,
      permissions: {
        actions,
        restrictedComponents,
        landingPage,
        menuStructure
      }
    };
  }
}