import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { PaginationDto, TestValidationDto } from './common/dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Test endpoint for validating PaginationDto via query parameters
   *
   * Tests:
   * - Query parameter transformation (string to number)
   * - Default values (page=1, limit=10)
   * - Min/max constraints
   *
   * @example
   * GET /test-pagination?page=1&limit=20
   * GET /test-pagination (uses defaults)
   * GET /test-pagination?page=0 (should fail - min is 1)
   * GET /test-pagination?limit=200 (should fail - max is 100)
   */
  @Get('test-pagination')
  testPagination(@Query() pagination: PaginationDto): {
    message: string;
    received: PaginationDto;
  } {
    return {
      message: 'Pagination validation successful',
      received: pagination,
    };
  }

  /**
   * Test endpoint for validating request body with TestValidationDto
   *
   * Tests:
   * - Required field validation
   * - Email format validation
   * - String length constraints
   * - Optional fields
   * - Nested object validation
   * - Whitelist behavior (unknown properties stripped/rejected)
   *
   * @example
   * POST /test-validation
   * {
   *   "name": "John Doe",
   *   "email": "john@example.com",
   *   "password": "securePassword123"
   * }
   */
  @Post('test-validation')
  testValidation(@Body() dto: TestValidationDto): {
    message: string;
    received: TestValidationDto;
  } {
    return {
      message: 'Body validation successful',
      received: dto,
    };
  }
}
