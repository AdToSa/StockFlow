import { HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ArgumentsHost } from '@nestjs/common';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './prisma-exception.filter';
import { ErrorResponse } from './http-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
    method: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/users',
      method: 'POST',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ArgumentsHost;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('P2002 - Unique constraint violation', () => {
    it('should return 409 Conflict with field names', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with this email already exists',
          error: 'Conflict',
          path: '/api/users',
        }),
      );
    });

    it('should handle multiple fields in unique constraint', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['tenantId', 'email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A record with this tenantId, email already exists',
        }),
      );
    });

    it('should handle missing target in meta', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {},
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A record with these values already exists',
        }),
      );
    });
  });

  describe('P2003 - Foreign key constraint violation', () => {
    it('should return 400 Bad Request with field name', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'tenantId' },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference: tenantId does not exist',
          error: 'Bad Request',
        }),
      );
    });
  });

  describe('P2025 - Record not found', () => {
    it('should return 404 Not Found', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: { cause: 'Record to update not found.' },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record to update not found.',
          error: 'Not Found',
        }),
      );
    });

    it('should use default message when cause is not provided', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: {},
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The requested record was not found',
        }),
      );
    });
  });

  describe('P2014 - Required relation violation', () => {
    it('should return 400 Bad Request with relation name', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Required relation violation',
        {
          code: 'P2014',
          clientVersion: '5.0.0',
          meta: { relation_name: 'User_tenant' },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Required relation 'User_tenant' is missing",
        }),
      );
    });
  });

  describe('P2016 - Query interpretation error', () => {
    it('should return 400 Bad Request', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Query interpretation error',
        {
          code: 'P2016',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'Query interpretation error: the query could not be processed',
        }),
      );
    });
  });

  describe('Unknown Prisma error', () => {
    it('should return 500 Internal Server Error', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
        }),
      );
    });
  });

  describe('Logging', () => {
    it('should log error for server errors', () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P2021',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log warning for client errors', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should log debug for not found errors', () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(debugSpy).toHaveBeenCalled();
    });
  });
});

describe('PrismaValidationExceptionFilter', () => {
  let filter: PrismaValidationExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
    method: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaValidationExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/users',
      method: 'POST',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ArgumentsHost;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper to get the response body with proper typing
   */
  function getResponseBody(): ErrorResponse {
    const calls = mockResponse.json.mock.calls as unknown[][];
    return calls[0][0] as ErrorResponse;
  }

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should return 400 Bad Request for validation errors', () => {
    const exception = new Prisma.PrismaClientValidationError(
      'Argument `email` is missing.',
      { clientVersion: '5.0.0' },
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        path: '/api/users',
      }),
    );
  });

  it('should include timestamp in response', () => {
    const exception = new Prisma.PrismaClientValidationError('Test error', {
      clientVersion: '5.0.0',
    });

    filter.catch(exception, mockArgumentsHost);

    const responseBody = getResponseBody();
    expect(responseBody.timestamp).toBeDefined();
  });
});
