import type {FormStepProps} from '../types';

export function FormStep({title, description, children, className}: FormStepProps) {
    return (
        <section className={className} aria-label={title}>
            {title && (
                <div style={{marginBottom: '1rem'}}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            lineHeight: 1.3,
                        }}
                    >
                        {title}
                    </h2>
                    {description && (
                        <p
                            style={{
                                margin: '0.375rem 0 0',
                                fontSize: '0.875rem',
                                opacity: 0.7,
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div>{children}</div>
        </section>
    );
}
