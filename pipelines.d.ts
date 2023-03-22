import { Model } from './model'

class Pipeline<T> implements PromiseLike<T> {
	then (resolve: (task: Promise<T>) => void): void;
	async execute (): Promise<T>;
}

export class FindPipeline extends Pipeline<any[]> {
	constructor (model: Model, where: any);

	sort (fields: Record<string, number>): this;
	sort (...fields: string[]): this;

	/** Keep only specified fields in result entires */
	select (...fields: string[]): this;
}

export class FindOnePipeline extends FindPipeline {}

export class DeletePipeline extends Pipeline<any[]> {
	constructor (model: Model, where: any);
}

export class DeleteOnePipeline extends FindPipeline {}

export class UpdatePipeline extends Pipeline<void> {
	constructor (model: Model, where: any, values: any);
}

export class UpdateOnePipeline extends UpdatePipeline {}
