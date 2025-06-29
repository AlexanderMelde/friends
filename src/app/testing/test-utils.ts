import { ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

export class TestUtils {
  static findByTestId<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): DebugElement {
    return fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  }

  static findAllByTestId<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
  }

  static clickElement(element: DebugElement): void {
    element.nativeElement.click();
  }

  static setInputValue(element: DebugElement, value: string): void {
    const input = element.nativeElement as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  static expectElementToExist<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): void {
    const element = this.findByTestId(fixture, testId);
    expect(element).toBeTruthy();
  }

  static expectElementNotToExist<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): void {
    const element = this.findByTestId(fixture, testId);
    expect(element).toBeFalsy();
  }

  static expectElementToHaveText<T>(
    fixture: ComponentFixture<T>,
    testId: string,
    expectedText: string
  ): void {
    const element = this.findByTestId(fixture, testId);
    expect(element.nativeElement.textContent.trim()).toBe(expectedText);
  }

  static expectElementToHaveClass<T>(
    fixture: ComponentFixture<T>,
    testId: string,
    className: string
  ): void {
    const element = this.findByTestId(fixture, testId);
    expect(element.nativeElement.classList.contains(className)).toBe(true);
  }

  static createMockFriend(overrides: Partial<any> = {}): any {
    return {
      id: 'test-friend-id',
      name: 'Test Friend',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Test bio',
      joinDate: new Date(),
      ...overrides
    };
  }

  static createMockEvent(overrides: Partial<any> = {}): any {
    return {
      id: 'test-event-id',
      title: 'Test Event',
      date: new Date(),
      location: 'Test Location',
      description: 'Test description',
      type: 'Social',
      attendees: [],
      ...overrides
    };
  }
}