"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSendError = exports.ValidationError = exports.ForbiddenKeywordError = exports.AuthenticationError = exports.OutreachGuardError = exports.CooldownActiveError = exports.ThreadNotFoundError = exports.ContactAlreadyExistsError = exports.ContactNotFoundError = void 0;
class ContactNotFoundError extends Error {
    constructor(message = 'Contact not found') {
        super(message);
        this.name = 'ContactNotFoundError';
    }
}
exports.ContactNotFoundError = ContactNotFoundError;
class ContactAlreadyExistsError extends Error {
    constructor(message = 'Contact already exists') {
        super(message);
        this.name = 'ContactAlreadyExistsError';
    }
}
exports.ContactAlreadyExistsError = ContactAlreadyExistsError;
class ThreadNotFoundError extends Error {
    constructor(message = 'Thread not found') {
        super(message);
        this.name = 'ThreadNotFoundError';
    }
}
exports.ThreadNotFoundError = ThreadNotFoundError;
class CooldownActiveError extends Error {
    constructor(message = 'Contact is in cooldown period') {
        super(message);
        this.name = 'CooldownActiveError';
    }
}
exports.CooldownActiveError = CooldownActiveError;
class OutreachGuardError extends Error {
    constructor(message = 'Outbound outreach not permitted') {
        super(message);
        this.name = 'OutreachGuardError';
    }
}
exports.OutreachGuardError = OutreachGuardError;
class AuthenticationError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class ForbiddenKeywordError extends Error {
    constructor(message = 'Message contains forbidden keywords') {
        super(message);
        this.name = 'ForbiddenKeywordError';
    }
}
exports.ForbiddenKeywordError = ForbiddenKeywordError;
class ValidationError extends Error {
    constructor(message = 'Bad request') {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class MessageSendError extends Error {
    constructor(message = 'Failed to send message') {
        super(message);
        this.name = 'MessageSendError';
    }
}
exports.MessageSendError = MessageSendError;
//# sourceMappingURL=errors.js.map