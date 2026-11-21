import { createLogger, format, transports } from 'winston';
import { utilities } from 'nest-winston';

const logger = createLogger({
    transports: [
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.ms(),
                utilities.format.nestLike('Healthlist')
            )
        })
    ]
});

export default logger;