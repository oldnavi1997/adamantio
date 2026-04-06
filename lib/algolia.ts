import { algoliasearch } from "algoliasearch";

export const INDEX_NAME = "products";

type AlgoliaClient = ReturnType<typeof algoliasearch>;

let _searchClient: AlgoliaClient | null = null;
let _adminClient: AlgoliaClient | null = null;

export function getSearchClient(): AlgoliaClient {
  if (!_searchClient) {
    _searchClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
    );
  }
  return _searchClient;
}

export function getAdminClient(): AlgoliaClient {
  if (!_adminClient) {
    _adminClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.ALGOLIA_ADMIN_KEY!
    );
  }
  return _adminClient;
}
