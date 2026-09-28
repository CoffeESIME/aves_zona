import type { TaxonFilter, TaxonGroup } from '@/src/types/biodiversity';

export const OTHER_TAXA_DESCRIPTION = '«Otros» agrupa peces, arácnidos, moluscos y otros organismos que no pertenecen a los grupos anteriores, además de registros sin grupo identificado. No significa que sean especies raras o amenazadas. eBird solo aporta aves y no devuelve registros en este grupo.';

export const TAXON_CONFIG: Record<
  TaxonFilter,
  { label: string; color: string; iconicTaxa: string[] | null }
> = {
  all: { label: 'Todos', color: '#365b49', iconicTaxa: null },
  birds: { label: 'Aves', color: '#3B82F6', iconicTaxa: ['Aves'] },
  plants: { label: 'Plantas', color: '#22C55E', iconicTaxa: ['Plantae'] },
  insects: { label: 'Insectos', color: '#EAB308', iconicTaxa: ['Insecta'] },
  fungi: { label: 'Hongos', color: '#A855F7', iconicTaxa: ['Fungi'] },
  mammals: { label: 'Mamíferos', color: '#F97316', iconicTaxa: ['Mammalia'] },
  herps: {
    label: 'Reptiles y anfibios',
    color: '#14B8A6',
    iconicTaxa: ['Reptilia', 'Amphibia'],
  },
  other: {
    label: 'Otros',
    color: '#64748B',
    iconicTaxa: [
      'Actinopterygii',
      'Animalia',
      'Arachnida',
      'Chromista',
      'Mollusca',
      'Protozoa',
      'unknown',
    ],
  },
};

const ICONIC_TO_GROUP: Record<string, TaxonGroup> = {
  Aves: 'birds',
  Plantae: 'plants',
  Insecta: 'insects',
  Fungi: 'fungi',
  Mammalia: 'mammals',
  Reptilia: 'herps',
  Amphibia: 'herps',
};

export function iconicTaxonToGroup(iconicTaxon?: string | null): TaxonGroup {
  return iconicTaxon ? (ICONIC_TO_GROUP[iconicTaxon] ?? 'other') : 'other';
}
