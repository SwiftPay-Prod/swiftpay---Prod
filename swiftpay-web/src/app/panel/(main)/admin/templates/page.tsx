import { TemplatesTable } from './templates-table';
import type { TemplatesTableFilters } from './use-templates-table';

export default function AdminTemplatesPage() {
	const initialFilters: TemplatesTableFilters = {
		page: 1,
		pageSize: 10,
	};

	return <TemplatesTable initialFilters={initialFilters} />;
}

