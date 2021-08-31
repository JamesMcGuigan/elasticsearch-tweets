# ElasticSearch Upgrade Process

I've previously gone through the process for both v2 -> v5 (more complex) and v5 -> v6 (less issues). However, I had the luxury of being familiar with my own codebase and servers whilst performing the upgrade.

There are three things that need to be looked at:
- ElasticSearch server configuration
- ElasticSearch schema files
- ElasticSearch queries in the codebase

The complexity of the process really depends on how many items in the breaking changes documentation affect you.

The major breaking change in v6 is the removal of having multiple mapping types per index. If your existing code used this feature, then this might require a bit of an architectural rethink about your design.

The basic process is to be systematic, read through all the breaking change documentation, line by line, going from your current v5.2 -> v6.x -> v7.11. For each item, check to see if it's a feature you have been using. Using grep or find-in-all-files will sometimes give you a quick answer.

The other useful approach is to attempt the v5->v6 then v6->v7 upgrade on a development server, and let ElasticSeach tell you if it sees any errors. You will want to rerun any unit tests you have, and possibly also have a round of manual testing.

- https://www.elastic.co/guide/en/elasticsearch/reference/5.0/breaking-changes-5.0.html
- https://www.elastic.co/guide/en/elasticsearch/reference/6.0/breaking-changes-6.0.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.0/breaking-changes-7.0.html

If you have persistent data, you will need to upgrade from v5 -> v6 and then v6 -> v7. Each upgrade will require a full cluster restart and downtime

for reindexing. If you have a data pipeline that can simply reload everything from an external data source into an empty ElasticSearch index, then you might be able to jump directly to v7.

I would also recommend testing this process in development first, with a branch of your codebase, before touching your production servers. Also ensure you have a working backup of your data.

A few questions:
- What is your current usecase for ElasticSearch?
- How large is your data and cluster?
- How sensitive are you to downtime?
- Do you have the ability to recreate everything in ElasticSearch from an external data-source/pipeline? Or are you storing user/application information not available elsewhere?
- Do you have an existing development team working on your project?
