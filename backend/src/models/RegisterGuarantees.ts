import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class RegisterGuarantees{

    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    nit: string = "";

    @Column()
    documento_identidad: string = "";

    @Column()
    pagare: string = "";
    
    @Column()
    nombres: string = "";

    @Column()
    apellidos: string = "";

    @Column()
    monto: string = "";

    @Column()
    otros: string = "";

    @Column()
    ciudad_desembolso: string = "";

    @Column()
    id_producto: string = "";

    @Column()
    sucursal: string = "";

    @Column()
    sector: string = "";

    @Column()
    fecha_desembolso: string = "";

    @Column()
    fecha_terminacion: string = "";

    @Column()
    tipo_credito: string = "";

    @Column()
    score_de_credito: string = "";

    @Column()
    fecha_de_nacimiento: string = "";

    @Column()
    genero: string = "";

    @Column()
    ocupacion: string = "";
    
    @Column()
    perfil_cliente: string = "";

    @Column()
    pagare_anterior: string = "";

    @Column()
    valor_fianza: string = "";

    @Column()
    fecha_proceso: string = "";

}