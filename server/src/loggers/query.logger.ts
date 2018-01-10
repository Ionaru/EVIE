import chalk from 'chalk';
import { Logger, QueryRunner } from 'typeorm';
import { logger } from 'winston-pnp-logger';

export class QueryLogger implements Logger {

    private static colorizeQuery(query: string): string {
        const queryWords = query.split(' ');
        const uppercaseRegex = new RegExp('^([A-Z]){2,}$');
        for (const queryWord of queryWords) {
            if (uppercaseRegex.test(queryWord)) {
                queryWords[queryWords.indexOf(queryWord)] = chalk.blueBright(queryWord);
            }
        }
        return queryWords.join(' ');
    }

    public logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
        let output = QueryLogger.colorizeQuery(query);
        if (parameters && parameters.length) {
            output += `; ${chalk.white(`(${parameters})`)}`;
        }
        logger.debug(output);
    }

    public logQueryError(_error: string, query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
        let output = QueryLogger.colorizeQuery(query);
        if (parameters && parameters.length) {
            output += `; ${chalk.white(`(${parameters})`)}`;
        }
        logger.error(_error);
        logger.error(output);
    }

    public logQuerySlow(_time: number, _query: string, _parameters?: any[], _queryRunner?: QueryRunner): void {
        return undefined;
    }

    public logSchemaBuild(_message: string, _queryRunner?: QueryRunner): void {
        return undefined;
    }

    public logMigration(_message: string, _queryRunner?: QueryRunner): void {
        return undefined;
    }

    public log(_level: any, _message: any, _queryRunner?: QueryRunner): void {
        return undefined;
    }
}
