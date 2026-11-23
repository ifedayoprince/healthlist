import { Reflector } from "@nestjs/core";

export const AllowAnonymous = Reflector.createDecorator<boolean>();
