CREATE TABLE `categorias_prontas` (
	`id` integer PRIMARY KEY NOT NULL,
	`posicao` integer NOT NULL,
	`categoria` text NOT NULL,
	`baixada_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `downloads_categoria` (
	`categoria_id` integer PRIMARY KEY NOT NULL,
	`inscricoes` text NOT NULL,
	`modelo` text,
	`baixado_em` integer NOT NULL
);
