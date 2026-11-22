import { Reflector } from "@nestjs/core";

export const AllowMCPAccess = Reflector.createDecorator<boolean>();
