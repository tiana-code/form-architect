import type {FormStepProps} from '../types';

export function FormStep({title, description, children, ...rest}: FormStepProps) {
    return (
        <section aria-label={title} {...rest}>
            {title && (
                <header>
                    <h2>{title}</h2>
                    {description && <p>{description}</p>}
                </header>
            )}
            <div>{children}</div>
        </section>
    );
}
