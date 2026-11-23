import { Reflector } from "@nestjs/core";

export const DoctorOnly = Reflector.createDecorator<boolean>();
