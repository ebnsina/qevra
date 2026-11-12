import { createContext } from 'svelte';

export interface RadioGroupContext {
	readonly name: string;
	readonly value: string | undefined;
	readonly disabled: boolean;
	readonly required: boolean;
	/** Set when the group shows an error; the message itself is tied to the group, where ARIA reads it. */
	readonly invalid: boolean;
	select(value: string): void;
}

export const [getRadioGroup, setRadioGroup] = createContext<RadioGroupContext>();
