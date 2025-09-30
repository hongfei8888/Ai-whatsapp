export class ContactNotFoundError extends Error {
  constructor(message = 'Contact not found') {
    super(message);
    this.name = 'ContactNotFoundError';
  }
}

export class ContactAlreadyExistsError extends Error {
  constructor(message = 'Contact already exists') {
    super(message);
    this.name = 'ContactAlreadyExistsError';
  }
}

export class ThreadNotFoundError extends Error {
  constructor(message = 'Thread not found') {
    super(message);
    this.name = 'ThreadNotFoundError';
  }
}


export class OutreachGuardError extends Error {
  constructor(message = 'Outbound outreach not permitted') {
    super(message);
    this.name = 'OutreachGuardError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenKeywordError extends Error {
  constructor(message = 'Message contains forbidden keywords') {
    super(message);
    this.name = 'ForbiddenKeywordError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Bad request') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class MessageSendError extends Error {
  constructor(message = 'Failed to send message') {
    super(message);
    this.name = 'MessageSendError';
  }
}