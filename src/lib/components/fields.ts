/** One input of an admin form. The same list drives the form, its values and its error messages. */
export interface Field {
	name: string;
	label: string;
	type?: 'text' | 'textarea' | 'richtext' | 'number' | 'switch' | 'image' | 'file' | 'select' | 'datetime' | 'email' | 'url' | 'color';
	required?: boolean;
	hint?: string;
	/** An example of what to type, shown while the input is empty. */
	placeholder?: string;
	rows?: number;
	options?: { value: string; label: string }[];
	/** Takes the whole row in a two-column form. Long text, files and switches always do. */
	wide?: boolean;
}

export type Item = Record<string, unknown>;
