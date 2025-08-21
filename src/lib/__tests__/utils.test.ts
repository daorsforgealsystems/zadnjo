import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cn, sanitizeInput, sanitizeRecord } from '../utils';

describe('Utils Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'text-blue-500')).toBe('px-2 py-1 text-blue-500');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should handle conflicting Tailwind classes', () => {
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle objects with conditional values', () => {
      expect(cn({ 'active': true, 'disabled': false })).toBe('active');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined)).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize basic HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeInput('<div>Content</div>')).toBe('Content');
      expect(sanitizeInput('<b>Bold</b> text')).toBe('Bold text');
    });

    it('should remove attributes from tags', () => {
      expect(sanitizeInput('<div onclick="malicious()">Content</div>')).toBe('Content');
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('');
      expect(sanitizeInput('<a href="javascript:alert(1)">Link</a>')).toBe('Link');
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should handle non-string values', () => {
      expect(sanitizeInput(123)).toBe('123');
      expect(sanitizeInput(true)).toBe('true');
      expect(sanitizeInput(false)).toBe('false');
      expect(sanitizeInput({})).toBe('[object Object]');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('\n\t test \n\t')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle complex HTML structures', () => {
      const complexHtml = `
        <div class="container">
          <p>Paragraph <span style="color: red">with styling</span></p>
          <script>maliciousCode();</script>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const result = sanitizeInput(complexHtml);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('maliciousCode');
      expect(result).toContain('Paragraph');
      expect(result).toContain('Item 1');
    });
  });

  describe('sanitizeRecord', () => {
    it('should sanitize string values in a record', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: '  john@example.com  ',
        age: 30,
        isActive: true,
        description: '<b>User description</b>'
      };

      const result = sanitizeRecord(input);

      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(30);
      expect(result.isActive).toBe(true);
      expect(result.description).toBe('User description');
    });

    it('should preserve non-string values unchanged', () => {
      const input = {
        count: 42,
        isValid: false,
        data: null,
        items: [1, 2, 3],
        config: { setting: true }
      };

      const result = sanitizeRecord(input);

      expect(result.count).toBe(42);
      expect(result.isValid).toBe(false);
      expect(result.data).toBe(null);
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.config).toEqual({ setting: true });
    });

    it('should handle empty objects', () => {
      const result = sanitizeRecord({});
      expect(result).toEqual({});
    });

    it('should handle objects with only non-string values', () => {
      const input = {
        number: 123,
        boolean: true,
        array: ['item1', 'item2'],
        object: { nested: 'value' }
      };

      const result = sanitizeRecord(input);
      expect(result).toEqual(input);
    });

    it('should handle mixed content with HTML in strings', () => {
      const input = {
        title: '<h1>Main Title</h1>',
        subtitle: 'Normal subtitle',
        content: '<p>Paragraph with <script>alert("xss")</script> content</p>',
        metadata: {
          nested: 'should not be processed'
        }
      };

      const result = sanitizeRecord(input);

      expect(result.title).toBe('Main Title');
      expect(result.subtitle).toBe('Normal subtitle');
      expect(result.content).toBe('Paragraph with  content');
      expect(result.metadata).toEqual({ nested: 'should not be processed' });
    });

    it('should maintain type safety', () => {
      interface TestRecord {
        name: string;
        age: number;
        isActive: boolean;
      }

      const input: TestRecord = {
        name: '<script>test</script>John',
        age: 25,
        isActive: true
      };

      const result: TestRecord = sanitizeRecord(input);

      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
      expect(result.isActive).toBe(true);
    });
  });
});